#!/usr/bin/node

var express = require('express')
var app = express()
var server = require('http').createServer(app)
var io = require('socket.io')(server)
var path = require('path')
var r = require('rethinkdb')

app.use(express.static(path.join(__dirname, 'client')))

function log (err, message, obj) {
  if (err) {
    throw err
  } else {
    if (message && obj) {
      console.log(new Date().toISOString() + ': ', message, obj)
    } else if (message) {
      console.log(new Date().toISOString() + ': ', message)
    }
  }
}

// Ensure the notes table exists:
r.connect().then(function (conn) {
  r.tableCreate('notes').run(conn, function () {
    // Ignore the error
    log(null, 'Notes table created.')
  })
}).error(function (err) {
  log(err)
})

server.listen(8000, function () {
  log(null, 'Server up and listening on port 8000')

  io.on('connect', function (socket) {
    log(null, 'Someone connected.')

    socket.on('add', function (note) {
      r.connect().then(function (conn) {
        r.table('notes').insert(note).run(conn, function (err, result) {
          log(err, 'Inserted', note)
        })
      }).error(function (err) {
        log(err)
      })
    })

    socket.on('move', function (note) {
      r.connect().then(function (conn) {
        r.table('notes').get(note.id).update(note).run(conn, function (err, result) {
          log(err, 'Updated', note)
        })
      }).error(function (err) {
        log(err)
      })
    })

    socket.on('delete', function (note) {
      r.connect().then(function (conn) {
        r.table('notes').get(note.id).delete().run(conn, function (err, cursor) {
          log(err, 'Deleted', note)
        })
      }).error(function (err) {
        log(err)
      })
    })

    socket.on('disconnect', function () {
      log(null, 'Someone disconnected.')
    })

    r.connect().then(function (conn) {
      r.table('notes').changes({includeInitial: true}).run(conn, function (err, cursor) {
        if (err) {
          log(err)
        }

        cursor.each(function (err, note) {
          log(err)

          if (!note.new_val) {
            socket.emit('delete', note.old_val.id)
          } else {
            socket.emit('note', note.new_val)
          }
        })
      })
    })
  })
})
