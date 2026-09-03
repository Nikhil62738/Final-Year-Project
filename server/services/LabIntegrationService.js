import { LabRepository } from "../repositories/GenericRepository.js";
import { createId } from "../utils/id.js";

const labs = new LabRepository();

export async function createSample(complaintId, lab = "Development Mock Lab") {
  return labs.insert({
    id: createId("sample"),
    sampleId: `LAB-${Date.now()}`,
    complaintId,
    lab,
    sentAt: new Date().toISOString(),
    testStatus: "Pending",
    result: "",
    receivedAt: null
  });
}
