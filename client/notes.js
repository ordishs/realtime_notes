/* global io $ */
$(document).ready(function () {
  // executes when complete page is fully loaded, including all frames, objects and images
  var client = io.connect()

  client.on('delete', function (id) {
    $('#' + id).remove()
  })

  client.on('note', function (note) {
    var noteAttributes = "<li class='note' id='" + note.id + "'><a><p>" + note.message + "</p><i class='fa fa-trash-o fa-2x trash-icon'></i></a></li>"

    var n = document.getElementById(note.id)
    if (n) {
      n.innerHtml = noteAttributes
    } else {
      $('#notes-ul').append(noteAttributes)
      $('.note').draggable()
    }
    $('#' + note.id).animate({
      left: note.xpos,
      top: note.ypos
    }, 1000)
  })

  $('#addicon').magnificPopup({
    type: 'inline',
    preloader: false,
    src: 'test-form',
    callbacks: {
      beforeOpen: function () {
        if ($(window).width() < 700) {
          this.st.focus = false
        } else {
          this.st.focus = '#note_t'
        }
      }
    }
  })

  $('#test-form').submit(function (event) {
    event.preventDefault()
    $.magnificPopup.close()
    var messageD = $('#note_t').val()

    var note = {
      message: messageD
    }

    client.emit('add', note)
    $('#note_t').val('')
  })

  $('#notes-ul').on('dragstop', 'li', function (event, ui) {
    var note = {
      id: event.target.id,
      xpos: ui.position.left,
      ypos: ui.position.top
    }

    client.emit('move', note)
  })

  $('#notes-ul').on('click', 'i', function (event) {
    client.emit('delete', {id: event.target.parentNode.parentNode.id})
  })
})
