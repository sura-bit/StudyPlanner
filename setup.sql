CREATE DATABASE IF NOT EXISTS studyplanner;
CREATE USER IF NOT EXISTS 'plannerapp'@'localhost' IDENTIFIED BY 'plannerapp1234';
GRANT ALL PRIVILEGES ON studyplanner.* TO 'plannerapp'@'localhost';
FLUSH PRIVILEGES;