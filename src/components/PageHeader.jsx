import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export default function PageHeader({ title, subtitle, action, icon }) {
  return (
    <Box sx={{ display: "flex", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 2, mb: 4 }}>
      <Box sx={{ flex: 1, display: "flex", gap: 2, alignItems: "center" }}>
        {icon}
        <Box>
          <Typography variant="h4" component="h1">{title}</Typography>
          {subtitle && <Typography color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>}
        </Box>
      </Box>
      {action}
    </Box>
  );
}
