Attribute VB_Name = "Form_PlayerLetterWinners"
Attribute VB_Base = "0{31B20BF4-3022-4520-BCEE-C0AA0BA2941A}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = False
Option Compare Database

Private Sub Command10_Click()
Let [PlayerNo] = [Player#]
Let [Season] = [SeasonID]
Let [Number Patch] = [PlayerYearEntered9th] + 4
Let [Certificate] = -1
If [ParticipateLastYear] = 0 Then Let [NumberPatchNeeded] = -1
If [SumOfVarsity] = 1 Then Let [VarsityPatchNeeded] = -1
If [Varsity] = -1 Then
Let [Varsity Letter] = -1
If [VarsityPatchNeeded] = -1 Then
Let [Ball] = -1
Let [Bar] = -1
Else
Let [Ball] = 0
Let [Bar] = -1
End If
End If

End Sub

Private Sub Command26_Click()
Certificate = -1
If PlayerYearEntered9th = Year(Now()) Then NumberPatchNeeded = -1
If ParticipateLastYear = 0 Then NumberPatchNeeded = -1
If NumberPatchNeeded = -1 Then NumberPatch = GraduationYear
If SumOfVarsity = 1 Then
VarsityLetter = -1
VarsityPatchNeeded = -1
Ball = -1
End If
If SumOfVarsity > 1 Then
Bar = -1
VarsityLetter = -1
End If




End Sub

Private Sub NumberPatchNeeded_Click()
NumberPatch = GraduationYear
End Sub

Private Sub VarsityPatchNeeded_Click()
If VarsityPatchNeeded = -1 Then
Bar = 0
Ball = -1
Else:
If VarsityLetter = -1 Then
Bar = -1
Ball = 0
End If
End If
    
End Sub
