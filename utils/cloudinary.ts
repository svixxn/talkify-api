import cloudinary from "cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const deleteOne = async ({
  folder,
  public_id,
}: {
  folder: string;
  public_id: string;
}) => {
  await cloudinary.v2.uploader.destroy(`${folder}/${public_id}`);
};

export const deleteMany = async ({
  folder,
  public_ids,
}: {
  folder: string;
  public_ids: string[] | null;
}) => {
  if (!public_ids) return;

  const extractedPublicIds = public_ids.map((public_id) => {
    const splittedPublicIds = public_id.split("/");
    const extractedPublicId = splittedPublicIds[
      splittedPublicIds.length - 1
    ].replace(".png", "");

    return extractedPublicId;
  });

  await cloudinary.v2.api.delete_resources(
    extractedPublicIds.map((public_id) => `${folder}/${public_id}`)
  );
};
