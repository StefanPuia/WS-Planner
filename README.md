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

Features
========
* google oauth login
* documents on user account
* document sharing
* real-time collaboration
* plain document (print friendly) format
* the documents have the following structure (referred to as 'blocks'):
	1. each document has multiple weeks (or topics)
	2. each week has multiple structures (lecture/practical/seminar etc.)
	3. each structure has multiple resources saved as URLs
* search in all documents on the dashboard page
* search in a specific document brings up the closest result, hiding all other irrelevant blocks
* each block is saved as soon as the user leaves the respective block container (on blur)
* when inserting a new block, the first field in the block is focused so the user can start typing straight away
* all blocks can be deleted
* weeks can be reordered by dragging the week number
* structure and resource blocks can be moved to a new parent
* if the parent has no children blocks after a move or a deletion, a new child will be inserted automatically
* responsive display on the dashboard page and the plain view
* the document structure is only limited on the client's processing capabilities
* client and server extensive logging

Known bugs
----------
* Moving a block to a diferent parent does not keep a specific order, because the blocks are sorted by id. Inserting an older block into a new parent will cause the block to move to the top.

Planned improvements
--------------------
* Proper block ordering
* History, undoing changes, document versions
* View-only sharing
* Add shared documents to dashboard
* Document import and export

# Reflection
Over the course of the year the project changed quite a lot, mostly because I found new and improved ways to do what was already in the project. Some examples of big changes are:

Drag and drop moving

I started with two buttons which would move a block up or down. I changed it to drag and drop just before moving the database from memory to an sql server. I realised the database would need to hold the positions as well so I did that, but since I was trying to create a robust application the fact that drag and drop started slowing down the app was not something that I liked. Then I changed it to an appending type because I realised that resource and structure ordering is not that important so I changed it to an alphabetic ordering for those, keeping the drag and drop ordering for the weeks.

Frameworks

Initially I was using Bootstrap because it made the designing easier but I rewrote the bits that interested me and I removed unnecessary code from the project.

Font icons

I ended up using google's material icons because they are lightweight, they match the user interface, and they are built with accessiblity in mind (if the icon doesn't load, the text will be displayed).

I received negative feedback on some of the features (the print feature for example) which I think it is fair from a technology unit/course point of view, but I have friends on non-computing courses who still have printed handouts. Since I am trying to create a universal planning application, I thought that any features that do not overcrowd the interface can still be useful.