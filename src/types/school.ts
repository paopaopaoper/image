export type SchoolAssetType =
  | "badge"
  | "landmark"
  | "name_stone"
  | "teaching_building"
  | "campus_scene";

export type SchoolAsset = {
  id: string;
  schoolName: string;
  displayName: string;
  type: SchoolAssetType;
  objectKey?: string;
};
