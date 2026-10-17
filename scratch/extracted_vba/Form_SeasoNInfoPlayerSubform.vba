Attribute VB_Name = "Form_SeasoNInfoPlayerSubform"
Attribute VB_Base = "0{B19AC1FB-1096-4BFC-8B21-E88E4D727DDE}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = False
Option Compare Database

Private Sub Form_Close()
DoCmd.SetWarnings True
End Sub

Private Sub Form_Load()
DoCmd.SetWarnings False
End Sub



Private Sub JuniorVarsity_AfterUpdate()
If Varsity + JuniorVarsity < 0 Then
Let ParticipatingThisYear = -1
Else:
Let ParticipatingThisYear = 0
End If
End Sub

Private Sub ParticipatingThisYear_AfterUpdate()
Me.Repaint
Let PlayerNo = PlayerID
Let PlayerSeason = SeasonID
Let Grade = Class

'If DLookup("participatingthisyear", "playerseasontable", "[player#]=" & [PlayerID] & " and [seasonid]=" & Season & "-1") = -1 Then
'Let ParticipateLastYear = -1
'Else:
'Let ParticipateLastYear = 0
End Sub


Private Sub Varsity_AfterUpdate()
If Varsity + JuniorVarsity < 0 Then
Let ParticipatingThisYear = -1
Else:
Let ParticipatingThisYear = 0
End If
End Sub
