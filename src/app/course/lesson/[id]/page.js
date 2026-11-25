"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ArrowBackRounded, ArrowForwardRounded, CheckRounded, CloseRounded, PictureAsPdfRounded, OpenInNewRounded } from "@mui/icons-material";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/client/api";
import { useNotify } from "@/components/NotifyProvider";
import { useAuth } from "@/components/AuthProvider";
import { courseLevelLabel, toEmbedUrl } from "@/lib/shared/course";

function Quiz({ lesson, answers, setAnswers, checked, setChecked }) {
  const { notifyError } = useNotify();
  const check = async (i) => {
    try {
      const { correct } = await api.post(`/api/course/lessons/${lesson._id}/check`, { index: i, answer: answers[i] || "" });
      setChecked((c) => ({ ...c, [i]: correct }));
    } catch (err) {
      notifyError(err);
    }
  };
  return (
    <Stack spacing={2}>
      {lesson.questions.map((q, i) => (
        <Card key={i} variant="outlined">
          <CardContent>
            <Typography sx={{ fontWeight: 600, mb: 1.5 }}>{i + 1}. {q.question}</Typography>
            <Box component="form" onSubmit={(e) => { e.preventDefault(); check(i); }} sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <TextField size="small" label="Answer" value={answers[i] || ""} onChange={(e) => { setAnswers({ ...answers, [i]: e.target.value }); setChecked((c) => ({ ...c, [i]: undefined })); }} sx={{ maxWidth: 240 }} />
              <Button type="submit" variant="outlined" disabled={!answers[i]}>Check</Button>
              {checked[i] === true && <Chip color="success" icon={<CheckRounded />} label="Correct" />}
              {checked[i] === false && <Chip color="error" icon={<CloseRounded />} label="Try again" />}
            </Box>
            {q.answer && <Typography variant="caption" color="text.secondary">Answer (teachers only): {q.answer}</Typography>}
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

function Lesson({ id }) {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { notify, notifyError, withLoading } = useNotify();
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState({});

  useEffect(() => {
    let alive = true;
    api.get(`/api/course/lessons/${id}`).then((l) => alive && setLesson(l)).catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [id]);

  const complete = async () => {
    try {
      const body = lesson.type === "question" ? { answers: lesson.questions.map((_, i) => answers[i] || "") } : {};
      const res = await withLoading(api.post(`/api/course/lessons/${id}/complete`, body));
      if (!res.passed) return notify(`You scored ${res.score}%. You need ${res.passMark}% to continue — have another go.`, "warning");
      if (res.finishedCourse) notify("You have finished the whole course. Amazing work!", "success");
      else if (res.score != null) notify(`Quiz passed with ${res.score}%!`, "success");
      const next = res.next?._id || lesson.next;
      router.push(next ? `/course/lesson/${next}` : "/course");
    } catch (err) {
      notifyError(err);
    }
  };

  if (error) return <Alert severity="warning" action={<Button component={Link} href="/course">Back to course</Button>}>{error}</Alert>;
  if (!lesson) return <Skeleton variant="rounded" height={420} />;

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      <Button component={Link} href={lesson.chapter ? `/course/${lesson.chapter.level}` : "/course"} startIcon={<ArrowBackRounded />} sx={{ mb: 2 }}>
        {lesson.chapter ? `${courseLevelLabel(lesson.chapter.level)} · ${lesson.chapter.title}` : "Course"}
      </Button>
      <Typography variant="overline" color="text.secondary">Lesson {lesson.position} of {lesson.count}</Typography>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>{lesson.title}</Typography>

      {lesson.type === "video" && (
        <Stack spacing={3}>
          {lesson.video_link.map((v, i) => {
            const embed = toEmbedUrl(v.link);
            return (
              <Card key={i}>
                {embed ? (
                  <Box component="iframe" src={embed} title={v.description || lesson.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen sx={{ width: "100%", aspectRatio: "16 / 9", border: 0, display: "block" }} />
                ) : (
                  <CardContent><Button href={v.link} target="_blank" rel="noopener noreferrer" endIcon={<OpenInNewRounded />}>Open video</Button></CardContent>
                )}
                {v.description && <CardContent><Typography>{v.description}</Typography></CardContent>}
              </Card>
            );
          })}
        </Stack>
      )}

      {lesson.type === "paper" && (
        <Stack spacing={2}>
          {lesson.download.map((d, i) => (
            <Card key={i}>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <PictureAsPdfRounded color="error" sx={{ fontSize: 40 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 600 }}>{d.name}</Typography>
                  {d.description && <Typography variant="body2" color="text.secondary">{d.description}</Typography>}
                </Box>
                {d.url ? <Button variant="outlined" href={d.url} target="_blank" rel="noopener noreferrer">Open</Button> : <Chip label="File missing" />}
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {lesson.type === "question" && <Quiz lesson={lesson} answers={answers} setAnswers={setAnswers} checked={checked} setChecked={setChecked} />}

      <Stack direction="row" sx={{ justifyContent: "space-between", mt: 4 }}>
        <Button component={Link} href={lesson.prev ? `/course/lesson/${lesson.prev}` : "/course"} startIcon={<ArrowBackRounded />}>Previous</Button>
        <Button variant="contained" size="large" endIcon={<ArrowForwardRounded />} onClick={complete}>
          {lesson.type === "question" ? "Submit quiz" : isAdmin ? "Next" : "Done — next lesson"}
        </Button>
      </Stack>
    </Box>
  );
}

export default function Page() {
  const { id } = useParams();
  // keyed by id: moving to the next lesson starts with a clean quiz
  return <RequireAuth><Lesson key={id} id={id} /></RequireAuth>;
}
