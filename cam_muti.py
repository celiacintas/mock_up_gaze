#!/usr/bin/env python2
# -*- coding: utf-8 -*-

import gevent
import gevent.monkey
from gevent.pywsgi import WSGIServer
import sys
import zmq.green as zmq
import time
import math
import json
from werkzeug.serving import run_with_reloader
from multiprocessing import Process
from opengazer_reader import OpenGazer
import socket

gevent.monkey.patch_all()


from flask import Flask, request, Response, render_template

DIR_PUB = 'tcp://127.0.0.1:5555'


app = Flask(__name__)
app.context = zmq.Context()

def opengazer_sender():
    myOpenGazer = OpenGazer(DIR_PUB, 20230)
    return myOpenGazer.send_data()

def events_generator():
    """Send updates with SSE events"""
    sock = app.context.socket(zmq.SUB)
    sock.connect(DIR_PUB)
    sock.setsockopt(zmq.SUBSCRIBE, "")
    while True:
        data = sock.recv()
        #print "Sending %s to client" % data
        yield 'data: %s\n\n' % data


@app.route('/events')
def sse_request():
    """URL where the events are posted"""
    return Response(events_generator(), mimetype='text/event-stream')

@app.route('/')
def index():
    return render_template('index.html')

#@run_with_reloader
def main():
        p = Process(target=opengazer_sender)
        p.start()
        #host, port = '192.168.43.9', 55555
        host, port = socket.gethostbyname(socket.gethostname()), 55555
        print "Running server at {host}:{port}".format(host=host, port=port)

        http_server = WSGIServer((host, port), app)
        http_server.serve_forever()
        p.kill()

if __name__ == '__main__':
    sys.exit(main())
