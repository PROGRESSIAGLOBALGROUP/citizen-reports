export const sendMock = jest.fn().mockResolvedValue({});
export const S3Client = jest.fn(() => ({ send: sendMock }));
export const PutObjectCommand = jest.fn((input) => input);
export const GetObjectCommand = jest.fn((input) => input);
