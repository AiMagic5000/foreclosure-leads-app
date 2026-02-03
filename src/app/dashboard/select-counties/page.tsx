"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MapPin, ArrowRight, Check, Info } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CountyMap } from "@/components/county-map"
import { countyDirectory } from "@/data/county-directory"

export default function SelectCountiesPage() {
  const router = useRouter()
  const [selectedCounties, setSelectedCounties] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCountiesChange = (counties: string[]) => {
    setSelectedCounties(counties)
  }

  const handleContinue = async () => {
    if (selectedCounties.length === 0) return

    setIsSubmitting(true)

    // In production, save selected counties to user profile
    // await fetch('/api/user/counties', {
    //   method: 'POST',
    //   body: JSON.stringify({ counties: selectedCounties })
    // })

    // Store in localStorage for demo
    localStorage.setItem('selectedCounties', JSON.stringify(selectedCounties))

    // Redirect to dashboard
    router.push('/dashboard')
  }

  // Get selected county details
  const selectedCountyDetails = selectedCounties.map(fips => ({
    fips,
    ...countyDirectory[fips]
  })).filter(c => c.name)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
            <MapPin className="w-4 h-4" />
            Step 1 of 2: Select Your Counties
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Choose Your Target Counties
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Select the counties where you want to find foreclosure leads.
            Zoom into the map to see county names, then click to select.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Interactive County Map</CardTitle>
                    <CardDescription>
                      Click on counties to select them. Zoom in to see county names.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-blue-500" />
                      <span className="text-slate-600">Judicial</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-orange-500" />
                      <span className="text-slate-600">Non-Judicial</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-emerald-500" />
                      <span className="text-slate-600">Selected</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CountyMap
                  isDark={false}
                  selectionMode={true}
                  selectedCounties={selectedCounties}
                  onCountiesChange={handleCountiesChange}
                />
              </CardContent>
            </Card>
          </div>

          {/* Selection Panel */}
          <div className="space-y-4">
            {/* Instructions */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">How to select counties:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Use zoom controls or scroll to zoom in</li>
                      <li>At 4x+ zoom, county names appear</li>
                      <li>Click on a county to select/deselect</li>
                      <li>Selected counties turn green</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selected Counties */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-500" />
                  Selected Counties ({selectedCounties.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedCounties.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4 text-center">
                    No counties selected yet. Click on the map to select counties.
                  </p>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {selectedCountyDetails.map(county => (
                      <div
                        key={county.fips}
                        className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">{county.name}</p>
                          <p className="text-xs text-slate-500">{county.state}</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedCounties(prev => prev.filter(f => f !== county.fips))
                          }}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Continue Button */}
            <Button
              onClick={handleContinue}
              disabled={selectedCounties.length === 0 || isSubmitting}
              className="w-full h-12 text-base font-semibold"
              style={{ backgroundColor: '#10b981' }}
            >
              {isSubmitting ? (
                "Setting up your dashboard..."
              ) : (
                <>
                  Continue to Dashboard
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            {selectedCounties.length > 0 && (
              <p className="text-xs text-center text-slate-500">
                You can always change your selected counties later in Settings.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
