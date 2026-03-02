import { Router } from "express";
import { getImageById } from "../db";

const router = Router();

router.get("/:id", async (req, res, next) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(404).send("Not found");
    }
    const image = await getImageById(id);
    if (!image) {
      return res.status(404).send("Image not found");
    }
    const buf = Buffer.isBuffer(image.data) ? image.data : Buffer.from(image.data);
    res.set("Content-Type", image.content_type);
    res.set("Cache-Control", "public, max-age=31536000, immutable");
    return res.send(buf);
  } catch (err) {
    next(err);
  }
});

export default router;
