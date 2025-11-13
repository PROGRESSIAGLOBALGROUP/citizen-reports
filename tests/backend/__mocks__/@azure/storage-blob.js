import fs from 'fs';

export const uploadFileMock = jest.fn().mockResolvedValue({});
export const createIfNotExistsMock = jest.fn().mockResolvedValue({});
export const downloadToFileMock = jest.fn(async (dest) => {
  fs.writeFileSync(dest, 'azuredata');
});

export const getBlockBlobClient = jest.fn(() => ({
  uploadFile: uploadFileMock,
  downloadToFile: downloadToFileMock,
}));

export const getContainerClient = jest.fn(() => ({
  createIfNotExists: createIfNotExistsMock,
  getBlockBlobClient,
}));

export const fromConnectionString = jest.fn(() => ({
  getContainerClient,
}));

export const BlobServiceClient = { fromConnectionString };
