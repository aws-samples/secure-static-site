import { useReducer } from 'react';
import Table from "@mui/material/Table";
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import LoadingButton from '@mui/lab/LoadingButton';
import { StatusChip } from './StatusChip';

const scriptUrl = "https://unpkg.com/react@17/umd/react.production.min.js";
const styleUrl = "https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css"
const fontUrl = "https://themes.googleusercontent.com/static/fonts/overlock/v2/Pr-80_x4SIOocpxz2VxC5fesZW2xOQ-xsNqO47m55DA.woff";
const imageUrl = `${window.location.origin}/SecureStaticSiteArchitecture.png`;
const mediaUrl = `${window.location.origin}/sup.mp4`;

const urlMaxWidth = 500;
const statusMinWidth = 100;

type ResourceState = {
  status?: string;
  loading: boolean;
}
type State = Record<string, ResourceState>

const initState: State = {
  script: {
    loading: false,
    status: undefined,
  },
  style: {
    loading: false,
    status: undefined,
  },
  font: {
    loading: false,
    status: undefined,
  },
  image: {
    loading: false,
    status: undefined,
  },
  media: {
    loading: false,
    status: undefined,
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

  function handleDownloadScript(url: string) {
    const key = "script";
    dispatch({ type: "request", key });
    const script = document.createElement("script");
    script.onload = () => dispatch({ type: "response", key, status: "200" });
    script.onerror = () => dispatch({ type: "response", key, status: "Blocked" });
    script.src = url;
    document.body.appendChild(script);
  }
  function handleDownloadStyle(url: string) {
    const key = "style";
    dispatch({ type: "request", key });
    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.onload = () => dispatch({ type: "response", key, status: "200" });
    style.onerror = () => dispatch({ type: "response", key, status: "Blocked" });
    style.href = url;
    document.body.appendChild(style);
  }
  async function handleDownloadFont(url: string) {
    const key = "font";
    dispatch({ type: "request", key });
    const fontFace = new FontFace("Roboto", `url(${url})`);
    try {
      await fontFace.load();
      dispatch({ type: "response", key, status: "200" })
    } catch (err) {
      dispatch({ type: "response", key, status: "Blocked" })
    }
  }
  function handleDownloadImage(url: string) {
    const key = "image";
    dispatch({ type: "request", key });
    const img = document.createElement("img");
    img.onload = () => dispatch({ type: "response", key, status: "200" });
    img.onerror = () => dispatch({ type: "response", key, status: "Blocked" });
    img.src = url;
  }
  function handleDownloadMedia(url: string) {
    const key = "media";
    dispatch({ type: "request", key });
    const video = document.createElement("video");
    video.onloadeddata = () => dispatch({ type: "response", key, status: "200" });
    video.onerror = () => dispatch({ type: "response", key, status: "Blocked" });
    video.src = url;
    video.load();
  }
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Content Type</TableCell>
          <TableCell>URL</TableCell>
          <TableCell>Download</TableCell>
          <TableCell sx={{ minWidth: statusMinWidth }}>Status</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell>Script</TableCell>
          <TableCell>{scriptUrl}</TableCell>
          <TableCell>
            <LoadingButton loading={state.script.loading} variant="contained" onClick={() => handleDownloadScript(scriptUrl)}>
              Download
            </LoadingButton>
          </TableCell>
          <TableCell sx={{ minWidth: statusMinWidth }}>
            <StatusChip status={state.script.status} />
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Style</TableCell>
          <TableCell>{styleUrl}</TableCell>
          <TableCell>
            <LoadingButton loading={state.style.loading} variant="contained" onClick={() => handleDownloadStyle(styleUrl)}>
              Download
            </LoadingButton>
          </TableCell>
          <TableCell sx={{ minWidth: statusMinWidth }}>
            <StatusChip status={state.style.status} />
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Font</TableCell>
          <TableCell sx={{ maxWidth: urlMaxWidth }}>{fontUrl}</TableCell>
          <TableCell>
            <LoadingButton loading={state.font.loading} variant="contained" onClick={() => handleDownloadFont(fontUrl)}>
              Download
            </LoadingButton>
          </TableCell>
          <TableCell sx={{ minWidth: statusMinWidth }}>
            <StatusChip status={state.font.status} />
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Image</TableCell>
          <TableCell>{imageUrl}</TableCell>
          <TableCell>
            <LoadingButton loading={state.image.loading} variant="contained" onClick={() => handleDownloadImage(imageUrl)}>
              Download
            </LoadingButton>
          </TableCell>
          <TableCell sx={{ minWidth: statusMinWidth }}>
            <StatusChip status={state.image.status} />
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Media</TableCell>
          <TableCell>{mediaUrl}</TableCell>
          <TableCell>
            <LoadingButton loading={state.media.loading} variant="contained" onClick={() => handleDownloadMedia(mediaUrl)}>
              Download
            </LoadingButton>
          </TableCell>
          <TableCell sx={{ minWidth: statusMinWidth }}>
            <StatusChip status={state.media.status} />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  )
}