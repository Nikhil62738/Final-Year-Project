import { BaseRepository } from "./BaseRepository.js";

export class OfficerRepository extends BaseRepository {
  constructor() {
    super("officers");
  }

  findByUsername(username) {
    return this.all().find((o) => o.username === username || o.email === username || o.phone === username);
  }
}
