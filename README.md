# WS-Planner
Weekly planner using web sockets for WebScript coursework

* Author: up823744

Installation
------------
1. Download Node.js
https://nodejs.org/en/

2. Download Git
https://git-scm.com/downloads

3. Clone repository
```bash
git clone https://github.com/StefanPuia/WS-Planner.git
```

4. Install modules
```bash
cd WS-Planner
npm install
```

Testing
-------
To run the server:
```bash
npm run dashboard
```
<i>The server runs by default on port 8080.
Due to the fact that google oauth api is being used, only "localhost:8080" is allowed as an origin</i>

To stop the server (Ctrl+C or Command+C):
```bash
^C
```

<i><b>Note:</b> The database is currently remote, if there seem to be any problems with the pages not loading or errors appearing in the console, install a local MySQL server, update /app/config/index.js:6 to point at the local database and import the file /DATABASE RESET.sql</i>

# Known bugs
* Moving a block to a diferent parent does not keep a specific order, because the blocks are sorted by id. Inserting an older block into a new parent will cause the block to move to the top.

# Planned improvements
* Proper block ordering