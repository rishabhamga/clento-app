import { S3 } from 'aws-sdk';

export enum S3BucketName {
    temporaryFiles = 'pocketly-temporary-files',
    documentBucket = 'pocketly-doc-bucket',
    recordingBucket = 'pocketly-recordings',
    publicBucket = 'pocketly-public-bucket',
    publicAgreementsBucket = 'pocketly-public-agreements',
    temporaryFilesWithAutoDelete = 'pocketly-temp-files-auto-delete',
}

export interface IAWSCreds {
    accessKey: string;
    secretKey: string;
    region?: string;
}

export interface S3UploadResponseData {
    Location: string;
}

export const isNullOrUndefined = (it: any) => it === null || it === undefined;

let AWSCreds: IAWSCreds | null = null;

export const SetAWSCreds = (newCreds: IAWSCreds) => {
    AWSCreds = { accessKey: newCreds.accessKey, secretKey: newCreds.secretKey, region: newCreds.region ?? 'ap-south-1' };
}

export const getFileFromS3 = (key: string, bucketName: string, credentials: IAWSCreds | null = null): Promise<Buffer | void> => {
    console.log(key, bucketName)
    if(!process.env.S3_BUCKET_ACCESS_KEY || !process.env.S3_BUCKET_SECRET_KEY){
        console.log('no AWS S3 keys set')
        return Promise.resolve();
    }

    SetAWSCreds({
        accessKey: process.env.S3_BUCKET_ACCESS_KEY,
        secretKey: process.env.S3_BUCKET_SECRET_KEY
    })
    return new Promise((resolve, reject) => {
        const PocketlyS3Bucket = new S3({
            accessKeyId: credentials?.accessKey ?? AWSCreds?.accessKey ?? process.env.S3_BUCKET_ACCESS_KEY,
            secretAccessKey: credentials?.secretKey ?? AWSCreds?.secretKey ?? process.env.S3_BUCKET_SECRET_KEY,
            region: credentials?.region ?? AWSCreds?.region ?? process.env.S3_BUCKET_REGION ?? 'ap-south-1',
        });
        PocketlyS3Bucket.getObject({ Key: key, Bucket: bucketName }, (err: Error, data: S3.Types.GetObjectOutput) => {
            if (err) {
                return reject(err);
            }
            resolve(data.Body as Buffer);
        });
    });
};

export const uploadFileToS3Bucket = (bucketName: S3BucketName,
    key: string,
    fileName: string,
    fileContentBuffer: Buffer,
    makePublic = false,
    honourFilename = false,
    contentType = undefined,
    skipContentDisposition = false,
    credentials: IAWSCreds | null = null): Promise<S3UploadResponseData | void> => {

    if(!process.env.S3_BUCKET_ACCESS_KEY || !process.env.S3_BUCKET_SECRET_KEY){
        console.log('no AWS S3 keys set')
        return Promise.resolve();
    }

    SetAWSCreds({
        accessKey: process.env.S3_BUCKET_ACCESS_KEY,
        secretKey: process.env.S3_BUCKET_SECRET_KEY
    })

    const PocketlyS3Bucket = new S3({
        accessKeyId: credentials?.accessKey ?? AWSCreds?.accessKey ?? process.env.S3_BUCKET_ACCESS_KEY,
        secretAccessKey: credentials?.secretKey ?? AWSCreds?.secretKey ?? process.env.S3_BUCKET_SECRET_KEY,
        region: credentials?.region ?? AWSCreds?.region ?? process.env.S3_BUCKET_REGION ?? 'ap-south-1',
    });
    return new Promise((resolve, reject) => {
        const params = {
            Bucket: bucketName,
            Key: key,
            Body: fileContentBuffer,
            ContentType: contentType,
            ContentDisposition: skipContentDisposition ? undefined : `attachment; filename="${fileName}"`,
        };
        if (isNullOrUndefined(params['ContentType'])) {
            delete params['ContentType'];
        }
        const isPublic = makePublic || bucketName === S3BucketName.publicBucket;
        if (isPublic) {
            (params as any).ACL = 'public-read';
        }

        PocketlyS3Bucket.upload(params, (err: Error, data: S3UploadResponseData) => {
            if (err) {
                return reject(err);
            }
            if (isPublic) {
                resolve(data);
            } else {
                data.Location = `/getS3File?key=${key}&bucket=${bucketName}&fileName=${encodeURI(fileName)}`;
                if (honourFilename) {
                    data.Location += `&honourFilename=true`;
                }
                resolve(data);
            }
        });
    });
};