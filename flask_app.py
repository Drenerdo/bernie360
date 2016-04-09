import os.path

from flask import Flask, render_template

STATIC_FOLDER   = os.path.abspath(os.path.split(__file__)[0])
TEMPLATE_FOLDER = STATIC_FOLDER

app = Flask(__name__,
            static_folder=STATIC_FOLDER,
            static_url_path='',
            template_folder=TEMPLATE_FOLDER)

app.debug = True


@app.route('/')
def home():
    return render_template("webvr_video.html")


def main():
    app.run(host='0.0.0.0', port=5000)


if __name__ == "__main__":
    main()
