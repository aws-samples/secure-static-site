import Chip from "@mui/material/Chip";
import Check from "@mui/icons-material/Check"
import Block from "@mui/icons-material/Block"

interface StatusChipProps {
  status?: string;
}

export function StatusChip(props: StatusChipProps) {
  const { status } = props;
  if (status === "200") {
    return <Chip color="success" icon={<Check />} label={status} />;
  } else if (status === "Blocked") {
    return <Chip color="error" icon={<Block />} label={status} />;
  } else {
    return null;
  }
}