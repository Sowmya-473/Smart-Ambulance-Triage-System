import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { AlertTriangle, Brain } from "lucide-react";

interface PredictedConditionProps {
  prediction: {
    condition: string;
    confidence: number;
    severity: "low" | "medium" | "high" | "critical";
    department: string;
  } | null;
  isLoading: boolean;
}

export function PredictedCondition({ prediction, isLoading }: PredictedConditionProps) {
  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getSeverityIcon = (severity: string) =>
    severity === "high" || severity === "critical" ? (
      <AlertTriangle className="h-4 w-4" />
    ) : null;

  // Loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Analyzing Condition...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-2 bg-gray-200 rounded w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!prediction) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Predicted Condition
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Enter patient symptoms and vitals to get AI-powered prediction.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Prediction display
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Predicted Condition
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Condition + severity */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">{prediction.condition}</h4>
            <Badge className={getSeverityStyle(prediction.severity)}>
              {getSeverityIcon(prediction.severity)}
              <span className="ml-1">{prediction.severity.toUpperCase()}</span>
            </Badge>
          </div>

          {/* Confidence */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Confidence</span>
              <span>{prediction.confidence}%</span>
            </div>
            <Progress value={prediction.confidence} className="h-2" />
          </div>
        </div>

        {/* Department */}
        <div>
          <p className="text-sm text-muted-foreground mb-1">
            Recommended Department
          </p>
          <Badge variant="outline" className="text-sm">
            {prediction.department}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
