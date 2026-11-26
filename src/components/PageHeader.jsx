import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

/** Page title area: big left-aligned title, one plain sentence, actions on the right. */
export default function PageHeader({ title, subtitle, action, icon }) {
  return (
    <Box sx={{ display: "flex", alignItems: { xs: "flex-start", sm: "flex-end" }, flexDirection: { xs: "column", sm: "row" }, gap: 2, mb: { xs: 3, md: 4 } }}>
      <Box sx={{ flex: 1, display: "flex", gap: 2, alignItems: "center", minWidth: 0 }}>
        {icon}
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h3" component="h1" sx={{ fontSize: { xs: "1.9rem", md: "2.3rem" } }}>{title}</Typography>
          {subtitle && <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 640 }}>{subtitle}</Typography>}
        </Box>
      </Box>
      {action && <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>{action}</Box>}
    </Box>
  );
}
