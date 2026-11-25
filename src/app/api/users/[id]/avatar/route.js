import { route, ok, notFound } from "@/lib/server/http";
import { requireUser, resolveTargetUser } from "@/lib/server/auth";
import { User } from "@/lib/server/models";
import { readUpload, storeFile, deleteFile } from "@/lib/server/uploads";

export const POST = route(async (req, { id }) => {
  const me = await requireUser();
  const target = resolveTargetUser(me, id);
  const user = await User.findById(target);
  if (!user) throw notFound("Student not found");
  const upload = await readUpload(req, "file", "image");
  const url = await storeFile("avatars", upload);
  const old = user.avatarUrl;
  user.avatarUrl = url;
  await user.save();
  await deleteFile(old);
  return ok({ avatarUrl: url });
});

export const DELETE = route(async (req, { id }) => {
  const me = await requireUser();
  const target = resolveTargetUser(me, id);
  const user = await User.findById(target);
  if (!user) throw notFound("Student not found");
  await deleteFile(user.avatarUrl);
  user.avatarUrl = undefined;
  await user.save();
  return ok({ avatarUrl: null });
});
