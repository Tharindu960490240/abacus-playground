"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import PageHeader from "@/components/PageHeader";
import FeatureIcon from "@/components/FeatureIcon";
import { api } from "@/lib/client/api";
import { useNotify } from "@/components/NotifyProvider";

export default function Tutorials() {
  const { notifyError } = useNotify();
  const [list, setList] = useState(null);
  useEffect(() => { api.get("/api/tutorials").then(setList).catch(notifyError); }, [notifyError]);
  return (
    <>
      <PageHeader title="Tutorials" subtitle="Step-by-step guides to soroban techniques." />
      <Grid container spacing={3}>
        {!list && [0, 1, 2].map((i) => <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}><Skeleton variant="rounded" height={220} /></Grid>)}
        {list?.length === 0 && <Grid size={12}><Typography color="text.secondary">No tutorials yet.</Typography></Grid>}
        {list?.map((t) => (
          <Grid key={t._id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ height: "100%" }}>
              <CardActionArea component={Link} href={`/tutorials/${t._id}`} sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch" }}>
                {t.imageUrl ? (
                  <CardMedia component="img" image={t.imageUrl} alt="" sx={{ height: 160, objectFit: "cover" }} />
                ) : (
                  <Box sx={{ height: 160, display: "grid", placeItems: "center", bgcolor: "action.hover" }}>
                    <FeatureIcon name="soroban" size={72} />
                  </Box>
                )}
                <CardContent sx={{ flex: 1 }}>
                  <Typography variant="overline" color="text.secondary">Tutorial {t.blognumber}</Typography>
                  <Typography variant="h6" component="h2">{t.title}</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  );
}
