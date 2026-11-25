"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ArrowBackRounded, ArrowForwardRounded, EditRounded } from "@mui/icons-material";
import { api } from "@/lib/client/api";
import { useNotify } from "@/components/NotifyProvider";
import { useAuth } from "@/components/AuthProvider";
import RichText from "@/components/RichText";

export default function Tutorial() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const { notifyError } = useNotify();
  const [post, setPost] = useState(null);
  useEffect(() => { api.get(`/api/tutorials/${id}`).then(setPost).catch(notifyError); }, [id, notifyError]);

  if (!post) return <Skeleton variant="rounded" height={400} />;
  return (
    <Box sx={{ maxWidth: 860, mx: "auto" }}>
      <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: "center" }}>
        <Button component={Link} href="/tutorials" startIcon={<ArrowBackRounded />}>All tutorials</Button>
        <Box sx={{ flex: 1 }} />
        {isAdmin && <Button component={Link} href={`/admin/tutorials/${id}`} startIcon={<EditRounded />}>Edit</Button>}
      </Stack>
      <Card>
        {post.imageUrl && <Box component="img" src={post.imageUrl} alt="" sx={{ width: "100%", maxHeight: 360, objectFit: "cover", display: "block" }} />}
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          <Chip label={`Tutorial ${post.index} of ${post.count}`} size="small" sx={{ mb: 2 }} />
          <Typography variant="h3" component="h1" sx={{ mb: 3, fontSize: { xs: 30, md: 40 } }}>{post.title}</Typography>
          <RichText html={post.description} />
        </CardContent>
      </Card>
      <Stack direction="row" sx={{ justifyContent: "space-between", mt: 3 }}>
        <Button component={Link} href={post.prev ? `/tutorials/${post.prev}` : "#"} disabled={!post.prev} startIcon={<ArrowBackRounded />}>Previous</Button>
        <Button component={Link} href={post.next ? `/tutorials/${post.next}` : "#"} disabled={!post.next} endIcon={<ArrowForwardRounded />}>Next</Button>
      </Stack>
    </Box>
  );
}
