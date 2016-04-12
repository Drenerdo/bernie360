import os.path
import logging
_logger = logging.getLogger(__name__)
from operator import itemgetter

from tornado.web import Application, RequestHandler
from tornado.ioloop import IOLoop

config = {
    'DEBUG': False,
    'PORT' : 5000
}

class MainHandler(RequestHandler):
    def get(self):
        self.render("index.html")

def main():
    root_dir = os.path.abspath(os.path.split(__file__)[0])
    app = Application([(r'/', MainHandler)],
                      debug=config.get('DEBUG', False),
                      static_path=root_dir,
                      static_url_prefix='/static/')

    _logger.info("app.settings:\n%s" % '\n'.join(['%s: %s' % (k, str(v))
                                                  for k, v in sorted(app.settings.items(),
                                                                     key=itemgetter(0))]))

    port = config.get('PORT', 5000)

    app.listen(port)
    _logger.info("listening on port %d" % port)
    _logger.info("press CTRL-C to terminate the server")
    _logger.info("""

*********************************
STARTING TORNADO APP!!!!!!!!!!!!!
*********************************

""")
    IOLoop.instance().start()



if __name__ == "__main__":
    logging.basicConfig(level=(logging.DEBUG if config.get('DEBUG') else logging.INFO),
                        format="%(asctime)s: %(levelname)s %(name)s %(funcName)s %(lineno)d:  %(message)s")
    main()
