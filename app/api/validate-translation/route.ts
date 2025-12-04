import { TranslationValidator } from "@/lib/translation-service"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { translation } = body

    // Validate translation format
    const validation = TranslationValidator.validate(translation)

    if (!validation.isValid) {
      return Response.json(
        {
          success: false,
          errors: validation.errors,
          warnings: validation.warnings,
        },
        { status: 400 },
      )
    }

    return Response.json(
      {
        success: true,
        isValid: true,
        warnings: validation.warnings,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Validation error:", error)
    return Response.json({ success: false, error: "Error validating translation" }, { status: 500 })
  }
}
