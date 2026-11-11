-- Run against postgres as a role with CREATEDB.
-- If rental already exists, stop and verify it belongs to this project.
CREATE DATABASE rental WITH TEMPLATE template0 ENCODING 'UTF8';
