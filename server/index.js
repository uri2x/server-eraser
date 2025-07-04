const express = require("express");
const path = require('path');
const fs = require('fs');
const xml2js = require('xml2js')

const PORT = process.env.PORT || 3001;
const CLIENT_PATH = process.env.CLIENT_PATH || '../web';
const HOME_PATH = process.env.HOME_PATH || '/home/user/Videos';

const app = express();

app.use(express.static(path.join(__dirname, CLIENT_PATH)));

console.log('PORT =', PORT);
console.log('CLIENT_PATH =', CLIENT_PATH);
console.log('HOME_PATH =', HOME_PATH);

app.get("/api", (req, res) => {
  let result;
  if (typeof req.query.del != 'undefined')
    result = deleteFile(req.query.del, req.query.dir);
  else
    result = getDirList(req.query.d);

  res.json(result);
});

app.get('/{*any}', function (req, res) {
  res.sendFile(path.join(__dirname, CLIENT_PATH + '/index.html'), function (err) {
    if (err)
      res.status(500).send(err)
  })
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

function base64_decode(text) {
  return Buffer.from(text, 'base64').toString();
}

function deleteFile(name64, dir64) {
  const dir = path.join(HOME_PATH, base64_decode(dir64));
  const name = base64_decode(name64);

  if (name.length < 4)
    return {};

  console.log('User wants to delete ' + name + ' from ' + dir);
  if (!fs.existsSync(dir))
    return {};

  fs.readdirSync(dir, { withFileTypes: true }).forEach(file => {
    if (file.isDirectory())
      return;

    const fn = file.name;
    if (fn.substring(0, name.length) == name) {
      const orgFile = path.join(dir, fn);
      const newFile = orgFile + '.bak';
      fs.rename(orgFile, newFile, () => { });
    }
  });

  return {};
}

function getFileTitle(dir, fn) {
  let nfoFile = path.join(dir, fn + '.nfo');
  if (!fs.existsSync(nfoFile))
    return fn;

  let retval = fn;

  const data = fs.readFileSync(nfoFile);
  xml2js.parseString(data, (err, result) => {
    if ((typeof result == 'object') && (typeof result.title == 'string') && (result.title.length)) {
      retval = result.title;
    }
  });

  return retval;
}

function getDirList(dir64) {
  let dir = base64_decode(typeof dir64 == 'undefined' ? '' : dir64);

  dir = path.join(HOME_PATH, dir);
  let dirname = dir.substr(HOME_PATH.length);

  if (!fs.existsSync(dir)) {
    dir = HOME_PATH;
    dirname = ''
  }

  if (dirname == '')
    dirname = path.sep;

  let result = { dir: dirname, dirs: [], files: [] };
  if (dir != HOME_PATH)
    result.dirs.push({ name: '..', title: '⤶' });

  fs.readdirSync(dir, { withFileTypes: true }).forEach(file => {
    let fn = file.name;
    const ext = fn.substr(-4).toLowerCase();
    if (!file.isFile()) {
      result.dirs.push({ name: fn, title: fn.replaceAll('.', ' ') });
    } else if ((ext == '.mkv') || (ext == '.mp4') || (ext == '.avi')) {
      fn = fn.substr(0, fn.length - 4);
      result.files.push({ name: fn, title: getFileTitle(dir, fn) });
    }
  });
  return result;
}
