import { useReducer } from 'react';
import Table from "@mui/material/Table";
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import LoadingButton from '@mui/lab/LoadingButton';
import { StatusChip } from './StatusChip';

type ResourceState = {
  type: string;
  url: string;
  status?: string;
  loading: boolean;
}
type State = Record<string, ResourceState>

const initState: State = {
  script: {
    type: "Script",
    url: "https://unpkg.com/react@17/umd/react.production.min.js",
    loading: false,
  },
  style: {
    type: "Style",
    url: "https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css",
    loading: false,
  },
  font: {
    type: "Font",
    url: "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap",
    loading: false,
  },
  image: {
    type: "Image",
    url: `${window.location.origin}/SecureStaticSiteArchitecture.png`,
    loading: false,
  },
  media: {
    type: "Media",
    url: `${window.location.origin}/sup.mp4`,
    loading: false,
  },
  iframe: {
    type: "iFrame",
    url: "https://www.youtube.com/embed/AT-nHW3_SVI",
    loading: false,
  },
}

type Action = { type: "request", key: string } | { type: "response", key: string, status: string };

function reducer(prevState: State, action: Action): State {
  switch(action.type) {
    case "request":
      return { ...prevState, [action.key]: { ...prevState[action.key], loading: true } };
    case "response":
      return { ...prevState, [action.key]: { ...prevState[action.key], loading: false, status: action.status } };
  }
}

export function ResourcesTable() {
  const [state, dispatch] = useReducer(reducer, initState);
  async function handleClick(key: string) {
    dispatch({ type: "request", key });
    let status = "Blocked";
    if (key === "video") {
      const video = document.createElement("video");
      video.onloadeddata = () => dispatch({ type: "response", key, status: "200" });
      video.onerror = () => dispatch({ type: "response", key, status });
      video.src = "/sup.mp4";
      video.load();
    } else if (key === "iframe") {
      const iframe = document.createElement("iframe");
      iframe.onload = () => {
        if (iframe.querySelector("body.neterror")) {
          dispatch({ type: "response", key, status })
        } else {
          dispatch({ type: "response", key, status: "200" })
        }
      }
      // iframe.onerror doesn't work so have to test inner html to determine if CSP block
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.src = state[key].url;
      iframe.style.display = "none";
      document.body.appendChild(iframe);
    } else {
      try {
        const res = await fetch(state[key].url);
        status = res.status.toString();
      } catch(err) {
        console.error(err);
      }
      dispatch({ type: "response", key, status });
    }
  }
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Content Type</TableCell>
          <TableCell>URL</TableCell>
          <TableCell>Download</TableCell>
          <TableCell>Status</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {Object.entries(state).map(([k, v]) => 
          <TableRow key={k}>
            <TableCell>{v.type}</TableCell>
            <TableCell>{v.url}</TableCell>
            <TableCell>
              <LoadingButton loading={v.loading} variant="contained" onClick={() => handleClick(k)}>
                Download
              </LoadingButton>
            </TableCell>
            <TableCell>
              <StatusChip status={v.status} />
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}