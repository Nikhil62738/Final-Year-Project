export function validateComplaint(body) {
  const errors = [];
  ["category", "description", "vendorName", "address", "district"].forEach((field) => {
    if (!body[field]) errors.push(field);
  });
  if (!body.anonymous && (!body.complainantName || !body.complainantPhone)) errors.push("contact");
  if (body.complainantPhone && !/^[6-9]\d{9}$/.test(String(body.complainantPhone))) errors.push("phone");
  return errors;
}
