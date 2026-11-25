"""Serve the Fuzzy web directory with its hosted Tripo API on localhost."""
import argparse
import json
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

UPSTREAM = "https://fuzzy-preview-git-feat-tripo-w-af628c-viviens-projects-842ec178.vercel.app"

class PreviewHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if urlsplit(self.path).path == "/api/tripo":
            self.proxy_tripo()
        else:
            super().do_GET()

    def do_POST(self):
        if urlsplit(self.path).path != "/api/tripo":
            self.send_error(404)
            return
        self.proxy_tripo()

    def api_error(self, status, message):
        body = json.dumps({"error": message}).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def proxy_tripo(self):
        port = self.server.server_port
        hosts = {f"localhost:{port}", f"127.0.0.1:{port}"}
        host = self.headers.get("Host")
        origin = self.headers.get("Origin")
        if host not in hosts or (origin and origin != "http://" + host):
            return self.api_error(403, "Request origin not allowed.")
        body = None
        if self.command == "POST":
            if self.headers.get_content_type() != "application/json":
                return self.api_error(415, "Expected a JSON request.")
            try:
                size = int(self.headers.get("Content-Length", "0"))
            except ValueError:
                size = -1
            if not 0 <= size <= 65536:
                return self.api_error(413, "Invalid request size.")
            body = self.rfile.read(size)
        req = Request(UPSTREAM + self.path, data=body, method=self.command,
                      headers={"Content-Type": "application/json", "Origin": UPSTREAM})
        try:
            try:
                response = urlopen(req, timeout=90)
            except HTTPError as error:
                response = error
            with response:
                if response.headers.get_content_type() not in {"application/json", "model/gltf-binary", "application/octet-stream"}:
                    return self.api_error(502, "Gift generation is unavailable. Please try again.")
                data = response.read()
                self.send_response(response.status)
                self.send_header("Content-Type", response.headers["Content-Type"])
                self.send_header("Content-Length", str(len(data)))
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                self.wfile.write(data)
        except (URLError, TimeoutError):
            self.api_error(502, "Could not reach gift generation. Please try again.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--directory", default=str(Path(__file__).resolve().parents[1] / "prototype" / "web"))
    parser.add_argument("--port", type=int, default=8463)
    args = parser.parse_args()
    ThreadingHTTPServer(("127.0.0.1", args.port),
                        partial(PreviewHandler, directory=args.directory)).serve_forever()
