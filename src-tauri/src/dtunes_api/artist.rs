use crate::dtunes_api::audio_file::AudioFile;
use chrono;
use rusqlite::{Connection, Result};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Artist {
    pub artist_id: usize,
    pub artist_name: String,
    pub artist_thumbnail: String,
    pub date_created: String,
    pub last_modified: String,
}

impl Artist {
    pub fn new(name: &str, thumbnail: &str) -> Artist {
        Artist {
            artist_id: 0,
            artist_name: String::from(name),
            artist_thumbnail: String::from(thumbnail),
            date_created: chrono::offset::Local::now().to_string(),
            last_modified: chrono::offset::Local::now().to_string(),
        }
    }

    pub fn insert(&mut self, conn: &Connection) -> Result<()> {
        let result = conn.execute(
            "INSERT INTO ARTIST 
                (ARTIST_NAME, ARTIST_THUMBNAIL, DATE_CREATED, LAST_MODIFIED) 
                VALUES (?1, ?2, ?3, ?4)",
            [
                &self.artist_name,
                &self.artist_thumbnail,
                &self.date_created,
                &self.last_modified,
            ],
        );

        match result {
            Ok(_) => {
                println!("Succesfully inserted artist");
                self.artist_id = conn.last_insert_rowid() as usize; 
                Ok(())
            },
            Err(err) => {
                println!("[artist::insert] sqlite3 error inserting artist: {:?}", err);
                Err(err)
            }
        }
    }

    pub fn retrieve(conn: &Connection) -> Result<Vec<Artist>> {
        let mut stmt = conn.prepare("SELECT * FROM ARTIST ORDER BY LAST_MODIFIED")?;
        let rows = stmt.query_map([], |row| {
            Ok(Artist {
                artist_id: row.get(0)?,
                artist_name: row.get(1)?,
                artist_thumbnail: row.get(2)?,
                date_created: row.get(3)?,
                last_modified: row.get(4)?,
            })
        })?;

        let mut genres = Vec::new();
        for genre in rows {
            genres.push(genre?);
        }

        Ok(genres)
    }

    pub fn update(&mut self, conn: &Connection, id: &str) -> Result<()> {
        /* change date modified */
        self.last_modified = chrono::offset::Local::now().to_string();
        let result = conn.execute(
            "UPDATE ARTIST
                SET ARTIST_NAME=?, ARTIST_THUMBNAIL=?, DATE_CREATED=?, LAST_MODIFIED=?
                WHERE ARTIST_ID=?",
            [
                &self.artist_name,
                &self.artist_thumbnail,
                &self.date_created,
                &self.last_modified,
                id,
            ],
        ); 

        match result {
            Ok(_) => {
                println!("Succesfully updated artist entity");
                return Ok(())
            },
            Err(err) => {
                println!("[artist::update] sqlite3 error updating artist: {:?}", err);
                return Err(err)
            }
        }
    }

    pub fn delete(conn: &Connection, id: &str) -> Result<()> {

        let cascade = conn.execute("DELETE FROM ARTIST_AUDIO_FILE WHERE ARTIST_ID=?", [id]);
        match cascade {
            Ok(_) => {
                println!("Succesfully removed any audio files associated with artist");
            },
            Err(err) => {
                println!("[artist::delete] sqlite3 error deleting artist audio files: {:?}", err);
                return Err(err)
            }
        }

        let delete_artist = conn.execute("DELETE FROM ARTIST WHERE ARTIST_ID=?", [id]);
        match delete_artist {
            Ok(_) => {
                println!("Succesfully deleted artist");
                return Ok(())
            },
            Err(err) => {
                println!("[artist::delete] sqlite3 error deleting artist: {:?}", err);
                return Err(err)
            }
        }
    }

    pub fn view(conn: &Connection, id: &str) -> Result<Artist> {
        let query = "SELECT * FROM ARTIST WHERE ARTIST_ID = ?";
        conn.query_row(query, &[&id], |row| {
            Ok(Artist {
                artist_id: row.get(0)?,
                artist_name: row.get(1)?,
                artist_thumbnail: row.get(2)?,
                date_created: row.get(3)?,
                last_modified: row.get(4)?,
            })
        })
    }

    pub fn add_audio_file(&mut self, conn: &Connection, audio_file_id: usize) -> Result<()> {

        let conn_result = conn.execute(
            "INSERT INTO ARTIST_AUDIO_FILE
                (ARTIST_ID, AUDIO_FILE_ID)
            VALUES (?1, ?2)
            ",
            [&self.artist_id, &audio_file_id],
        ); 

        match conn_result {
            Ok(_)  => {
                println!("Successfully added audio file to artist");
                return Ok(())
            }, 
            Err(err) => {
                println!("[artist::add_audio_file] sqlite3 error: {:?}", err);
                return Err(err) 
            }
        }
    }

    pub fn retrieve_audio_files(conn: &Connection, id: &str) -> Result<Vec<AudioFile>> {
        /* many to many query */
        let query = "SELECT * FROM AUDIO_FILE WHERE AUDIO_FILE_ID IN ( 
            SELECT AUDIO_FILE_ID FROM ARTIST_AUDIO_FILE WHERE ARTIST_ID=?);";
        let mut stmt = conn.prepare(&query)?;

        let audio_files: Result<Vec<AudioFile>> = stmt
            .query_map([id], |row| {
                Ok(AudioFile {
                    audio_file_id: row.get(0)?,
                    file_name: row.get(1)?,
                    file_path: row.get(2)?,
                    thumbnail: row.get(3)?,
                    duration: row.get(4)?,
                    plays: row.get(5)?,
                    sample_rate: row.get(6)?,
                    date_created: row.get(7)?,
                    last_modified: row.get(8)?,
                })
            })?
            .collect();
        audio_files
    }

    pub fn search_audio_files(
        conn: &Connection,
        id: &str,
        search_term: &str,
    ) -> Result<Vec<AudioFile>> {
        let query = format!("SELECT * FROM AUDIO_FILE WHERE AUDIO_FILE_ID IN ( 
            SELECT AUDIO_FILE_ID FROM ARTIST_AUDIO_FILE WHERE ARTIST_ID=? AND AUDIO_FILE.FILE_NAME LIKE '%{}%');", search_term);
        let mut stmt = conn.prepare(&query)?;
        let audio_files: Result<Vec<AudioFile>> = stmt
            .query_map([id], |row| {
                Ok(AudioFile {
                    audio_file_id: row.get(0)?,
                    file_name: row.get(1)?,
                    file_path: row.get(2)?,
                    thumbnail: row.get(3)?,
                    duration: row.get(4)?,
                    plays: row.get(5)?,
                    sample_rate: row.get(6)?,
                    date_created: row.get(7)?,
                    last_modified: row.get(8)?,
                })
            })?
            .collect();
        audio_files
    }

    pub fn remove_audio_file(&self, conn: &Connection, audio_file_id: usize) -> Result<()> {
        let conn_result = conn.execute(
            "DELETE FROM ARTIST_AUDIO_FILE
                WHERE ARTIST_ID=? AND AUDIO_FILE_ID=?
            ",
            [&self.artist_id, &audio_file_id],
        );

        match conn_result {
            Ok(_)  => {
                println!("Successfully removed audio file from artist");
                return Ok(())
            }, 
            Err(err) => {
                println!("[artist::remove_audio_file] sqlite3 error: {:?}", err);
                return Err(err)
            }
        }
    }

    pub fn search(conn: &Connection, search_term: &str) -> Result<Vec<Artist>> {
        let query = format!(
            "SELECT * FROM ARTIST WHERE ARTIST_NAME LIKE '%{}%'",
            search_term
        );
        let mut stmt = conn.prepare(&query)?;
        let artists: Result<Vec<Artist>> = stmt
            .query_map([], |row| {
                Ok(Artist {
                    artist_id: row.get(0)?,
                    artist_name: row.get(1)?,
                    artist_thumbnail: row.get(2)?,
                    date_created: row.get(3)?,
                    last_modified: row.get(4)?,
                })
            })?
            .collect();
        artists
    }
}
