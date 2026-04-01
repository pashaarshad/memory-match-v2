// Placeholder: returns all dataset images now so the upload flow is testable.
// Next step is replacing this with real face embedding comparison.
export async function matchFaceFromDataset(_selfieFile, dataset) {
  return dataset.map((item) => ({
    fileName: item.fileName,
    path: item.publicPath,
    score: 1,
  }));
}
