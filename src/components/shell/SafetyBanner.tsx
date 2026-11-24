import React from 'react';
import { usePatientStore } from '../../store/usePatientStore';
import { AlertBanner } from '../ui/AlertBanner';

export const SafetyBanner: React.FC = () => {
  const guardrails = usePatientStore(s => s.guardrails);

  if (!guardrails || guardrails.length === 0) return null;

  // Filter for critical or warning alerts
  const urgentAlerts = guardrails.filter(g => g.level === 'critical' || g.level === 'warning');
  if (urgentAlerts.length === 0) return null;

  const topAlert = urgentAlerts[0];

  return (
    <div className="w-full px-3 py-2 bg-[var(--surface)] border-b border-[var(--line)]">
      <AlertBanner
        level={topAlert.level}
        titleEn={topAlert.titleEn}
        titleAr={topAlert.titleAr}
        messageEn={topAlert.messageEn}
        messageAr={topAlert.messageAr}
        actionEn={topAlert.actionEn}
        actionAr={topAlert.actionAr}
      />
    </div>
  );
};
