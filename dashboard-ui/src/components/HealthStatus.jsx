function HealthStatus({ title, value, isHealthy, healthyText = "OK", unhealthyText = "FAULT" }) {
  const finalIsHealthy = isHealthy !== undefined ? isHealthy : value;
  let statusClass;
  let displayText;

  if (finalIsHealthy === true) {
    statusClass = 'healthy';
    displayText = healthyText;
  } else if (finalIsHealthy === false) {
    statusClass = 'unhealthy';
    displayText = unhealthyText;
  } else {
    statusClass = 'unknown';
    displayText = 'N/A';
  }

  return (
    <div className={`health-item ${statusClass}`}>
      <span>{title}</span>
      <span className="health-indicator">{displayText}</span>
    </div>
  );
}
export default HealthStatus;