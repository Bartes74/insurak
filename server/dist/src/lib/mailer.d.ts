interface ResetEmailInput {
    to: string;
    token: string;
    expiresAt: Date;
}
interface NotificationEmailInput {
    to: string;
    assetId: number;
    assetName: string;
    endDate: Date;
    stage: 'first' | 'followup' | 'deadline';
}
export declare function sendResetEmail({ to, token, expiresAt }: ResetEmailInput): Promise<void>;
export declare function sendNotificationEmail({ to, assetId, assetName, endDate, stage }: NotificationEmailInput): Promise<void>;
export {};
//# sourceMappingURL=mailer.d.ts.map