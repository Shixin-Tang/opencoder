import { coderDir } from "@/lib/env.js"
import { createStorage } from "unstorage"
import fsLiteDriver from "unstorage/drivers/fs-lite"

export const messageStorage = createStorage({
  driver: (fsLiteDriver as any)({ base: coderDir }),
})
