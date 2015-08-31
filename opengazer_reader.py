#!/usr/bin/env python2
# -*- coding: utf-8 -*-

import os
import zmq
import json
import sys
import socket
import time
from cStringIO import StringIO

# For screencast
import base64
from PyQt4.QtGui import QPixmap, QApplication
from PyQt4.Qt import QBuffer, QIODevice
from PIL import Image

import gevent
import gevent.monkey

gevent.monkey.patch_all()


class OpenGazer(object):

    def __init__(self, dir_pub, socket_opengazer_c):
        self.ctx_zmq = zmq.Context()
        self.socket = self.ctx_zmq.socket(zmq.PUB)
        self.socket.bind(dir_pub)
        self.socket_opengazer_c = socket_opengazer_c
        self.app = QApplication(sys.argv)
        self.buffer = QBuffer()

    def get_screen(self):
        self.buffer.open(QIODevice.ReadWrite)
        QPixmap.grabWindow(QApplication.desktop().winId()).scaled(480, 240).save(self.buffer, 'jpeg', quality=50)
        self.strio = StringIO()
        self.strio.write(self.buffer.data())
        self.buffer.close()
        self.strio.seek(0)

    def send_data(self):
        my_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        my_socket.bind(("", self.socket_opengazer_c))
        print("socket creado")
        while True:
            data, addr = my_socket.recvfrom(self.socket_opengazer_c)
            self.get_screen()
            image_data = base64.b64encode(self.strio.getvalue())
            data_to_send = {'screen': image_data, 'x': int(data.split(' ')[0]),
                            'y': int(data.split(' ')[1]), 'target': int(data.split(' ')[2])}
            message = json.dumps(data_to_send)
            self.socket.send(message)
            #self.app.processEvents()
        my_socket.close()  # todo poner en finally


def main():
        my_og = OpenGazer('tcp://127.0.0.1:3344', 20230)
        my_og.send_data()

if __name__ == '__main__':
    main()
