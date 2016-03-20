# realtime_notes
Simple real-time, multi-user Notes application using web-sockets and RethinkDB

This application depends on a locally running RethinkDB database.  See https://rethinkdb.com/docs/install/.

To run this example:

```
npm install
```

and then

```
node server
```

In your browser, goto [webapp](http://localhost:8000/)

I have included local versions of js, css and fonts so this can be run locally.

### Server

The server application is using Express and Socket.io.  It listens on all local interfaces on port 8000.

It will serve the client webapp and dependencies as well as listen to socket messages:

* add
* move
* delete

It also emits 'note' messages each time a note is changed in RethinkDB.


### Client

The client is based on the example in Gianluca Tiepolo's excellent book [Getting Started with RethinkDB](https://www.packtpub.com/big-data-and-business-intelligence/getting-started-rethinkdb), although all ajax() calls have been replaced by socket messages.
