import os
import time
import sqlite3
from pathlib import Path


# Function to read SQL from a file
def read_sql_file(file_path):
    with open(file_path, 'r') as file:
        sql_content = file.read()
    return sql_content


def commit(directory, database_storage_path):
    for filename in os.listdir(directory):
        file_path = os.path.join(directory, filename)
        if os.path.isfile(file_path):
            if os.path.getsize(file_path) != 0:
                sql_query = read_sql_file(file_path)
                conn = sqlite3.connect(database_storage_path)
                cursor = conn.cursor()
                cursor.executescript(sql_query)
                print(f'[sqlite3]: Executing {file_path} on dtunes.sqlite3')
                conn.close()


def commit_test_dbs(test_db_path: str, scripts_folder: str):

    dbs = [
        "dtunes-test-playlists.sqlite3",
        "dtunes-test-audio-files.sqlite3",
        "dtunes-test-genres.sqlite3",
        "dtunes-test-pomodoro.sqlite3",
        "dtunes-test-artists.sqlite3"
    ]

    # Create unit test dbs if test path is empty
    if len(os.listdir(test_db_path)) == 0:
        for db in dbs:
            conn = sqlite3.connect(f'{test_db_path}/{db}')
            conn.close()
            print(f"[sqlite3]: Creating unit testing database file in tests/{db}")
 
    # commit changes for testing databases
    for db in dbs:
        commit(scripts_folder, f'{test_db_path}/{db}')

def commit_local_storage_paths(app_name: str, scripts_folder: str):

    share_path = Path.home() / ".local" / f"share/{app_name}"
    image_path = f"{share_path}/images"
    files_path = f"{share_path}/audio_files"
    db_path = f"{share_path}/metadata"

    if not os.path.isdir(image_path):
        print(f"[dtunes]: Creating image path: {image_path}")
        os.mkdir(image_path)
    
    if not os.path.isdir(files_path):
        print(f"[dtunes]: Creating audio path: {image_path}")
        os.mkdir(files_path)

    if not os.path.isdir(db_path):
        print(f"[dtunes]: Creating database path: {db_path}/{app_name}.sqlite3")
        os.mkdir(db_path)
        conn = sqlite3.connect(f"{db_path}/{app_name}.sqlite3")
        conn.close()

    commit(scripts_folder, f"{db_path}/{app_name}.sqlite3")

# Config
SCRIPTS_FOLDER = "sql"
TESTING_DB_PATH = "tests"
APP_NAME = "dtunes-audio-app"

def main():
    commit(SCRIPTS_FOLDER, f'build/{APP_NAME}.sqlite3')


main()


