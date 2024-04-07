import { useState, useEffect } from "react";
import { Routes, Route, Link, useParams, useNavigate } from "react-router-dom";
import { Buffer } from 'buffer';
import './App.css';

function base64_encode(text) {
  return Buffer.from(text).toString('base64');
}

function Directory({ dir, name }) {
  return (
    <div className="item">
      <Link to={"/" + base64_encode(dir + "/" + name)}>&#128193;&nbsp;&nbsp;{name}</Link>
    </div>
  );
}

function File({ dir, name, title }) {
  const navigate = useNavigate();

  return (
    <div className="item">
      {title}
      &nbsp;&nbsp;
      <Link to="" onClick={() => DeleteFile(dir, name, title, navigate)}>&#128465;</Link>
    </div>
  );
}

function DeleteFile(dir, name, title, navigate) {
  if (!window.confirm('Are you sure you with to delete ' + title + ' ?'))
    return false;

  fetch("/api?del=" + base64_encode(name) + '&dir= ' + base64_encode(dir), { cache: "no-cache" })
    .then(res => res.json())
    .then(
      (result) => {
        navigate(0);
      },
      (error) => {
        navigate(0);
      }
    );

  return false;
}

function ShowDirectory() {
  const params = useParams();
  const directory64 = params.name ?? '';

  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [items, setItems] = useState([]);
  const [directoryName, setDirectoryName] = useState('/');

  useEffect(() => {
    console.log('Fetching ' + directory64);
    fetch("/api?d=" + directory64, { cache: "no-cache" })
      .then(res => res.json())
      .then(
        (result) => {
          setDirectoryName(result.dir);
          setIsLoaded(true);
          setItems(result);
          console.log('RESULT: ', result);
        },

        (error) => {
          setIsLoaded(true);
          setError(error);
          console.log('ERROR: ', error);
        }
      );
  }, [directory64]);

  if (error) {
    return <div>Error: {error.message}</div>;
  } else if (!isLoaded) {
    return <div>Loading...</div>;
  } else {

    return (
      <div className="dir">
        <h1>{items.dir}</h1>
        {items.dirs.map((o, i) => (<Directory key={o.name} dir={items.dir} name={o.name} />))}
        {items.files.map((o, i) => (<File key={o.name} dir={items.dir} name={o.name} title={o.title} />))}
      </div>
    );
  }
}

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <Routes>
          <Route path="/" element={<ShowDirectory />} />
          <Route path="/:name" element={<ShowDirectory />} />
        </Routes>
      </header>
    </div>
  );
}

export default App;
