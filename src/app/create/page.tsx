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
          <Button
            variant="ghost"
            onClick={handleBackToCreate}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Create Another Meeting
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-6 w-6" />
                Meeting Created Successfully!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950 dark:border-green-800">
                <p className="text-green-800 dark:text-green-200">
                  Your meeting "<strong>{createdMeeting.title}</strong>" has been created! Share the codes below with participants.
                </p>
              </div>

              {/* Short Event Code */}
              <div className="p-4 border-2 border-primary rounded-lg bg-primary/5">
                <h3 className="font-semibold mb-3 text-primary">📋 Event Code (Quick Share)</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={createdMeeting.shareToken}
                    readOnly
                    className="flex-1 p-3 border border-border rounded-lg bg-background text-lg font-mono text-center"
                  />
                  <Button
                    onClick={() => copyToClipboard(createdMeeting.shareToken)}
                    variant="default"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Code
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>Quick option:</strong> Participants can enter this code on the home page to join
                </p>
              </div>

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

              {/* Organizer Link */}
              <div>
                <h3 className="font-medium mb-3">Your Organizer Link</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={organizeUrl}
                    readOnly
                    className="flex-1 p-3 border border-border rounded-lg bg-muted text-sm font-mono"
                  />
                  <Button
                    onClick={() => copyToClipboard(organizeUrl)}
                    variant="outline"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {copiedToClipboard ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button
                    onClick={() => window.open(organizeUrl, '_blank')}
                    variant="default"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Manage Meeting
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Use this link to manage your meeting, propose time slots, and view responses.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => window.location.href = `/event/${createdMeeting.shareToken}?role=organizer&setup=true`}
                  className="flex-1"
                  size="lg"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Set Up Your Availability
                </Button>
                <Button
                  variant="outline"
                  onClick={handleBackToCreate}
                  size="lg"
                >
                  Create Another Event
                </Button>
              </div>

              {/* Next Steps */}
              <div className="p-4 border border-border rounded-lg">
                <h3 className="font-medium mb-3">Next Steps</h3>
                <ol className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">1</span>
                    <span>Click "Set Up Your Availability" above to configure your schedule</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">2</span>
                    <span>Share the event code or link with participants</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">3</span>
                    <span>Monitor responses and use the heat map to find the optimal time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">4</span>
                    <span>Finalize the meeting time once you have enough responses</span>
                  </li>
                </ol>
              </div>

              {/* Meeting Details */}
              <div className="p-4 bg-muted/30 rounded-lg">
                <h3 className="font-medium mb-2">Meeting Details</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div><strong>Meeting ID:</strong> {createdMeeting.id}</div>
                  <div><strong>Share Token:</strong> {createdMeeting.shareToken}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Create New Event
        </h1>
        <p className="text-muted-foreground">
          Create your event and you&apos;ll immediately set up your availability on a drag-and-drop grid.
        </p>
      </div>

      <MeetingCreator
        onMeetingCreated={handleMeetingCreated}
        onCancel={() => window.history.back()}
      />
    </AppShell>
  );
}