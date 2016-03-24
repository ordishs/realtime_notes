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

function clean (str) {
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Ensure the realtime_notes table exists:
r.connect().then(function (conn) {
  r.tableCreate('realtime_notes').run(conn, function () {
    // Ignore the error
    log(null, 'realtime_notes table created.')

    server.listen(8000, '0.0.0.0', function () {
      log(null, 'Server up and listening on port 8000')

      io.on('connect', function (socket) {
        log(null, 'Someone connected.')

        socket.on('add', function (note) {
          r.connect().then(function (conn) {
            r.table('realtime_notes').insert(note).run(conn, function (err, result) {
              log(err, 'Inserted', note)
            }).finally(function () {
              conn.close()
            })
          }).error(function (err) {
            log(err)
          })
        })

        socket.on('move', function (note) {
          r.connect().then(function (conn) {
            r.table('realtime_notes').get(note.id).update(note).run(conn, function (err, result) {
              log(err, 'Updated', note)
            }).finally(function () {
              conn.close()
            })
          }).error(function (err) {
            log(err)
          })
        })

        socket.on('delete', function (note) {
          r.connect().then(function (conn) {
            r.table('realtime_notes').get(note.id).delete().run(conn, function (err, cursor) {
              log(err, 'Deleted', note)
            }).finally(function () {
              conn.close()
            })
          }).error(function (err) {
            log(err)
          })
        })

        socket.on('disconnect', function () {
          log(null, 'Someone disconnected.')
        })

        r.connect().then(function (conn) {
          r.table('realtime_notes').changes({includeInitial: true}).run(conn, function (err, cursor) {
            if (err) {
              log(err)
            }

            cursor.each(function (err, note) {
              log(err)

              if (!note.new_val) {
                socket.emit('delete', clean(note.old_val.id))
              } else {
                note.new_val.id = clean(note.new_val.id)
                note.new_val.message = clean(note.new_val.message)
                socket.emit('note', note.new_val)
              }
            })
          })
        })
      })
    })
  })
}).error(function (err) {
  log(err)
})
