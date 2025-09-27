"use client";

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { MeetingCreator } from '@/components/MeetingCreator';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { CheckCircle, Copy, ExternalLink, ArrowLeft, Calendar } from 'lucide-react';

interface CreatedMeeting {
  id: string;
  title: string;
  shareToken: string;
}

export default function CreatePage() {
  const [createdMeeting, setCreatedMeeting] = useState<CreatedMeeting | null>(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  const handleMeetingCreated = (meetingId: string, shareToken: string, title: string) => {
    setCreatedMeeting({
      id: meetingId,
      title: title,
      shareToken: shareToken
    });
  };

  const handleBackToCreate = () => {
    setCreatedMeeting(null);
  };

  const shareUrl = createdMeeting ?
    `${window.location.origin}/event/${createdMeeting.shareToken}` : '';

  const organizeUrl = createdMeeting ?
    `${window.location.origin}/event/${createdMeeting.shareToken}?role=organizer` : '';

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  if (createdMeeting) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto">

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-6 w-6" />
                Meeting Created Successfully
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Full Share Link */}
              <div>
                <h3 className="font-medium mb-3">🔗 Full Share Link</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 p-3 border border-border rounded-lg bg-muted text-sm font-mono"
                  />
                  <Button
                    onClick={() => copyToClipboard(shareUrl)}
                    variant="outline"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                  <Button
                    onClick={() => window.open(shareUrl, '_blank')}
                    variant="outline"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Direct link participants can click to join the event immediately
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleBackToCreate}
                  size="lg"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Create Another Event
                </Button>
                <Button
                  onClick={() => window.location.href = `/event/${createdMeeting.shareToken}?role=organizer&setup=true`}
                  className="flex-1"
                  size="lg"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Continue &rarr;
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>

      <MeetingCreator
        onMeetingCreated={handleMeetingCreated}
        onCancel={() => window.history.back()}
      />
    </AppShell>
  );
}