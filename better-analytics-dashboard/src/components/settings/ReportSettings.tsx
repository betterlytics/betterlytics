"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Plus, X } from "lucide-react";
import { DashboardSettingsUpdate } from "@/entities/settings";
import { z } from "zod";

type ReportSettingsProps = {
  formData: DashboardSettingsUpdate;
  onUpdate: (updates: Partial<DashboardSettingsUpdate>) => void;
};

const emailSchema = z.string().email();

export default function ReportSettings({ formData, onUpdate }: ReportSettingsProps) {
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const validateEmail = (email: string): boolean => {
    try {
      emailSchema.parse(email);
      setEmailError("");
      return true;
    } catch (error) {
      setEmailError("Please enter a valid email address");
      return false;
    }
  };

  const addEmail = () => {
    if (!newEmail.trim()) {
      setEmailError("Email address is required");
      return;
    }

    if (!validateEmail(newEmail.trim())) {
      return;
    }

    const currentEmails = formData.reportRecipients || [];
    const emailToAdd = newEmail.trim().toLowerCase();
    
    if (currentEmails.some(email => email.toLowerCase() === emailToAdd)) {
      setEmailError("This email address is already added");
      return;
    }

    onUpdate({
      reportRecipients: [...currentEmails, emailToAdd]
    });
    setNewEmail("");
    setEmailError("");
  };

  const removeEmail = (emailToRemove: string) => {
    const currentEmails = formData.reportRecipients || [];
    onUpdate({
      reportRecipients: currentEmails.filter(email => email !== emailToRemove)
    });
  };

  const handleEmailChange = (value: string) => {
    setNewEmail(value);
    if (emailError) {
      setEmailError("");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText size={20} />
            Automated Reports
          </CardTitle>
          <CardDescription>
            Configure automatic report generation and delivery
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Weekly Reports</Label>
              <p className="text-sm text-muted-foreground">
                Receive weekly analytics summaries via email
              </p>
            </div>
            <Switch 
              checked={formData.weeklyReports ?? false}
              onCheckedChange={(checked) => 
                onUpdate({ weeklyReports: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Monthly Reports</Label>
              <p className="text-sm text-muted-foreground">
                Receive monthly analytics summaries via email
              </p>
            </div>
            <Switch 
              checked={formData.monthlyReports ?? false}
              onCheckedChange={(checked) => 
                onUpdate({ monthlyReports: checked })
              }
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <Label className="text-base">Report Recipients</Label>
            <p className="text-sm text-muted-foreground">
              Email addresses that will receive automated reports
            </p>
            
            <div className="flex gap-2 space-y-2">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={newEmail}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addEmail();
                    }
                  }}
                  className={emailError ? "border-destructive" : ""}
                />
                {emailError && (
                  <p className="text-sm text-destructive mt-1">{emailError}</p>
                )}
              </div>
              <Button onClick={addEmail} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {(formData.reportRecipients || []).map((email) => (
                <Badge key={email} variant="secondary" className="flex items-center gap-1">
                  {email}
                  <button
                    onClick={() => removeEmail(email)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 