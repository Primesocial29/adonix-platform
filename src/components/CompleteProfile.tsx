import PartnerProfileSetup from './PartnerProfileSetup';

export default function CompleteProfile() {
  return <PartnerProfileSetup onComplete={() => {
    window.location.href = '/partner-dashboard';
  }} />;
}