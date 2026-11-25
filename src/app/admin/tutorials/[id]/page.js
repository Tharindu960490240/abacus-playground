"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ArrowBackRounded, DeleteOutlineRounded, ImageRounded, SaveRounded } from "@mui/icons-material";
import RequireAuth from "@/components/RequireAuth";
import RichEditor from "@/components/RichEditor";
import { api } from "@/lib/client/api";
import { useNotify } from "@/components/NotifyProvider";

function Editor() {
  const { id } = useParams();
  const isNew = id === "new";
  const router = useRouter();
  const { notify, notifyError, withLoading } = useNotify();
  const [title, setTitle] = useState("");
  const [number, setNumber] = useState("");
  const [html, setHtml] = useState("");
  const [imageUrl, setImageUrl] = useState(null);
  const [loaded, setLoaded] = useState(isNew);
  const fileRef = useRef(null);

  useEffect(() => {
    if (isNew) return;
    api.get(`/api/tutorials/${id}`).then((t) => {
      setTitle(t.title); setNumber(String(t.blognumber)); setHtml(t.description || ""); setImageUrl(t.imageUrl || null); setLoaded(true);
    }).catch(notifyError);
  }, [id, isNew, notifyError]);

  const save = async () => {
    try {
      const body = { title, description: html, ...(number !== "" ? { blognumber: Number(number) } : {}) };
      if (isNew) {
        const { _id } = await withLoading(api.post("/api/tutorials", body));
        notify("Tutorial created", "success");
        router.replace(`/admin/tutorials/${_id}`);
      } else {
        await withLoading(api.patch(`/api/tutorials/${id}`, { ...body, blognumber: Number(number || 0) }));
        notify("Tutorial saved", "success");
      }
    } catch (err) {
      notifyError(err);
    }
  };

  const upload = async (file) => {
    if (!file) return;
    try {
      const { imageUrl: url } = await withLoading(api.upload(`/api/tutorials/${id}/image`, file));
      setImageUrl(url);
    } catch (err) {
      notifyError(err);
    }
  };

  if (!loaded) return null;
  return (
    <>
      <Button component={Link} href="/admin/tutorials" startIcon={<ArrowBackRounded />} sx={{ mb: 2 }}>All tutorials</Button>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>{isNew ? "New tutorial" : "Edit tutorial"}</Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                <RichEditor value={html} onChange={setHtml} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <TextField label="Order number" type="number" value={number} onChange={(e) => setNumber(e.target.value)} helperText={isNew ? "Leave empty to add at the end" : undefined} />
                  <Button variant="contained" size="large" startIcon={<SaveRounded />} onClick={save} disabled={!title.trim()}>{isNew ? "Create" : "Save"}</Button>
                </Stack>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Cover image</Typography>
                {isNew ? <Typography color="text.secondary" variant="body2">Save the tutorial first, then add a cover image.</Typography> : (
                  <>
                    {imageUrl && <Box component="img" src={imageUrl} alt="" sx={{ width: "100%", borderRadius: 2, mb: 2 }} />}
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
                    <Stack direction="row" spacing={1}>
                      <Button startIcon={<ImageRounded />} variant="outlined" onClick={() => fileRef.current?.click()}>{imageUrl ? "Replace" : "Upload"}</Button>
                      {imageUrl && <Button color="error" onClick={() => withLoading(api.del(`/api/tutorials/${id}/image`)).then(() => setImageUrl(null)).catch(notifyError)} aria-label="Remove image"><DeleteOutlineRounded /></Button>}
                    </Stack>
                  </>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </>
  );
}

export default function Page() {
  return <RequireAuth admin><Editor /></RequireAuth>;
}
