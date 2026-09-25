package com.struva.map.ui.solve

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.struva.map.network.dto.RelationshipDto
import com.struva.map.ui.common.ScoreResultView
import com.struva.map.ui.common.StruvaButton
import com.struva.map.ui.common.StruvaOutlinedButton
import com.struva.map.ui.theme.EyebrowStyle
import com.struva.map.ui.theme.StruvaColors
import com.struva.map.ui.theme.struvaTopAppBarColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SolveScreen(
    onFinished: () -> Unit,
    onOpenComparison: (String) -> Unit,
    onOpenPrediction: (String) -> Unit = {},
    viewModel: SolveViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsState()
    var showExitConfirm by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {},
                navigationIcon = {
                    if (state !is SolveUiState.Result) {
                        ExitButton(onClick = { showExitConfirm = true })
                    }
                },
                colors = struvaTopAppBarColors(),
            )
        },
    ) { padding ->
        Box(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentAlignment = Alignment.Center,
        ) {
            when (val s = state) {
                is SolveUiState.Loading -> CircularProgressIndicator()

                is SolveUiState.Error -> Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(s.message)
                    Spacer(Modifier.height(12.dp))
                    StruvaButton(onClick = viewModel::load) { Text("Tekrar dene") }
                }

                is SolveUiState.SubmitFailed -> Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.padding(24.dp),
                ) {
                    Text(s.message, color = StruvaColors.Bad)
                    Spacer(Modifier.height(4.dp))
                    Text(
                        "Cevapların kaybolmadı, sadece gönderim başarısız oldu — tekrar dene.",
                        style = MaterialTheme.typography.bodySmall,
                        color = StruvaColors.Muted,
                    )
                    Spacer(Modifier.height(16.dp))
                    StruvaButton(onClick = viewModel::retrySubmit) { Text("Tekrar gönder") }
                }

                is SolveUiState.ChooseRelationship -> ChooseRelationshipStep(
                    options = s.options,
                    onChoose = viewModel::chooseRelationship,
                )

                is SolveUiState.ContextQuestion -> Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                    Text("Ek soru ${s.position + 1} / ${s.total}", style = EyebrowStyle)
                    Spacer(Modifier.height(16.dp))
                    Text(s.question.text, style = MaterialTheme.typography.headlineSmall)
                    Spacer(Modifier.height(24.dp))
                    s.question.options.forEach { opt ->
                        OutlinedButton(
                            onClick = { viewModel.chooseContextAnswer(s.question.id, opt.value) },
                            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                            shape = RoundedCornerShape(10.dp),
                            border = BorderStroke(1.dp, StruvaColors.Border),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = StruvaColors.Text),
                        ) { Text(opt.label) }
                    }
                }

                is SolveUiState.Question -> Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                    ProgressBar(fraction = s.position / s.total.toFloat())
                    Spacer(Modifier.height(8.dp))
                    Text("Soru ${s.position + 1} / ${s.total}", style = EyebrowStyle)
                    Spacer(Modifier.height(16.dp))
                    Text(s.question.text, style = MaterialTheme.typography.headlineSmall)
                    Spacer(Modifier.height(24.dp))
                    s.question.options.forEachIndexed { idx, opt ->
                        val isSelected = s.selectedOptionIndex == idx
                        OutlinedButton(
                            onClick = { viewModel.chooseAnswer(s.question.id, idx) },
                            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                            shape = RoundedCornerShape(10.dp),
                            border = BorderStroke(1.dp, if (isSelected) StruvaColors.Accent else StruvaColors.Border),
                            colors = ButtonDefaults.outlinedButtonColors(
                                containerColor = if (isSelected) StruvaColors.AccentSoft else StruvaColors.Surface,
                                contentColor = StruvaColors.Text,
                            ),
                        ) { Text(opt.label) }
                    }
                    Spacer(Modifier.height(24.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        if (s.position > 0) {
                            StruvaOutlinedButton(onClick = viewModel::goBack) { Text("Geri") }
                        } else {
                            Spacer(Modifier.height(1.dp))
                        }
                        if (s.isLast) {
                            StruvaButton(
                                onClick = viewModel::finish,
                                enabled = s.selectedOptionIndex != null && !s.submitting,
                            ) { Text(if (s.submitting) "Gönderiliyor…" else "Sonucu Gör") }
                        }
                    }
                }

                is SolveUiState.Result -> ScoreResultView(
                    s.score,
                    resultId = s.resultId,
                    onOpenComparison = onOpenComparison,
                    onDone = onFinished,
                    onOpenPrediction = onOpenPrediction,
                )
            }
        }
    }

    if (showExitConfirm) {
        AlertDialog(
            onDismissRequest = { showExitConfirm = false },
            title = { Text("Testten çıkmak istediğine emin misin?") },
            text = { Text("Cevapların kaydedilmedi, çıkarsan kaybolur.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        showExitConfirm = false
                        onFinished()
                    },
                    colors = ButtonDefaults.textButtonColors(contentColor = StruvaColors.Bad),
                ) { Text("Çık") }
            },
            dismissButton = {
                TextButton(onClick = { showExitConfirm = false }) { Text("Devam et") }
            },
        )
    }
}

// Çıkış butonu: TopAppBar'ın navigationIcon'ında ikon yerine çerçeveli
// "Çıkış" pili — tasarım karşılaştırmasında seçilen seçenek (B).
@Composable
private fun ExitButton(onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .padding(start = 8.dp)
            .clip(RoundedCornerShape(999.dp))
            .border(1.dp, StruvaColors.Border, RoundedCornerShape(999.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 8.dp),
    ) {
        Text("Çıkış", style = MaterialTheme.typography.labelLarge, color = StruvaColors.Text)
    }
}

// Web'deki .progress: track her zaman --border renginde, dolgu accent, aynı
// giriş easing'i sorudan soruya yumuşak geçiş için.
@Composable
private fun ProgressBar(fraction: Float, modifier: Modifier = Modifier) {
    val animatedFraction by animateFloatAsState(
        targetValue = fraction.coerceIn(0f, 1f),
        animationSpec = tween(250, easing = CubicBezierEasing(0.22f, 0.61f, 0.36f, 1f)),
        label = "solveProgress",
    )
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(6.dp)
            .clip(RoundedCornerShape(99.dp))
            .background(StruvaColors.Border),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth(animatedFraction)
                .height(6.dp)
                .clip(RoundedCornerShape(99.dp))
                .background(StruvaColors.Accent),
        )
    }
}

// Sorulardan önce: sonuç hangi ilişki için? Seçilen ilişkiye gönderimde
// otomatik bağlanır (Harita / ilişki detayı); "Şimdilik geç" bağsız bırakır.
@Composable
private fun ChooseRelationshipStep(
    options: List<RelationshipDto>,
    onChoose: (existingId: String?, newLabel: String?) -> Unit,
) {
    var newLabel by remember { mutableStateOf("") }
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
    ) {
        Text("BAŞLAMADAN ÖNCE", style = EyebrowStyle)
        Spacer(Modifier.height(16.dp))
        Text("Kimin için çözüyorsun?", style = MaterialTheme.typography.headlineSmall)
        Spacer(Modifier.height(8.dp))
        Text(
            "Sonuç bu ilişkiye bağlanır; aynı ilişki için tekrar çözdükçe Harita'da nasıl değiştiğini görürsün.",
            style = MaterialTheme.typography.bodyMedium,
            color = StruvaColors.Muted,
        )
        Spacer(Modifier.height(24.dp))
        options.forEach { option ->
            OutlinedButton(
                onClick = { onChoose(option.id, null) },
                modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                shape = RoundedCornerShape(10.dp),
                border = BorderStroke(1.dp, StruvaColors.Border),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = StruvaColors.Text),
            ) { Text(option.label) }
        }
        if (options.isNotEmpty()) Spacer(Modifier.height(16.dp))
        OutlinedTextField(
            value = newLabel,
            onValueChange = { newLabel = it.take(40) },
            label = { Text(if (options.isEmpty()) "İlişkiye bir ad ver (ör. Ayşe, Yöneticim)" else "Yeni ilişki") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(8.dp))
        StruvaButton(
            onClick = { onChoose(null, newLabel) },
            enabled = newLabel.isNotBlank(),
            modifier = Modifier.fillMaxWidth(),
        ) { Text("Bu ilişkiyle başla") }
        Spacer(Modifier.height(8.dp))
        TextButton(onClick = { onChoose(null, null) }, modifier = Modifier.align(Alignment.CenterHorizontally)) {
            Text("Şimdilik geç", color = StruvaColors.Muted)
        }
    }
}
