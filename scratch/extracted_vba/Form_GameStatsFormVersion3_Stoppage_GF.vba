Attribute VB_Name = "Form_GameStatsFormVersion3_Stoppage_GF"
Attribute VB_Base = "0{6FE77881-07BB-4C49-8EFB-A8EF8C5A859E}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = False
Option Compare Database
Option Explicit

Private Sub Assister_AfterUpdate()
Let [AssistedBy#] = Assister
End Sub

Private Sub Scorer_AfterUpdate()
Let [Scorer#] = Scorer
If IsNull(GameEventID) Then
GameEventID = strGameEvent
End If
End Sub
 
